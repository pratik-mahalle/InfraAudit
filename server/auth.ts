import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, User } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cloudguard-super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        // Try to find user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found, try by email (supports both username and email login)
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username/email or password' });
        } else {
          // Update last login time
          await storage.updateUser(user.id, { 
            lastLoginAt: new Date(),
            updatedAt: new Date() 
          });
          
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // API endpoint to register a new user and create organization if needed
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing username
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      let organizationId = req.body.organizationId;
      
      // If creating a new organization with the user registration
      if (req.body.createOrganization && req.body.organizationName) {
        // Create the organization
        const organization = await storage.createOrganization({
          name: req.body.organizationName,
          displayName: req.body.organizationDisplayName || req.body.organizationName,
          billingEmail: req.body.email,
          planType: "free",
        });
        
        organizationId = organization.id;
      }
      
      // Set the current timestamp for user creation
      const now = new Date();
      
      // Create the user
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        organizationId,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        // Initialize trial fields but don't activate yet (user will click "Start Trial" button later)
        trialStatus: "inactive",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Invalid username/email or password"
        });
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) return next(loginErr);
        
        // Return user without sensitive information
        const { password, ...userWithoutPassword } = user;
        
        // Get organization info if the user is part of one
        if (user.organizationId) {
          storage.getOrganization(user.organizationId)
            .then(organization => {
              if (organization) {
                res.status(200).json({
                  ...userWithoutPassword,
                  organization: {
                    id: organization.id,
                    name: organization.name,
                    displayName: organization.displayName,
                    planType: organization.planType
                  }
                });
              } else {
                res.status(200).json(userWithoutPassword);
              }
            })
            .catch(err => {
              console.error("Error fetching organization:", err);
              res.status(200).json(userWithoutPassword);
            });
        } else {
          res.status(200).json(userWithoutPassword);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Start the 7-day free trial
  app.post("/api/start-trial", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const user = req.user as SelectUser;
      
      // Check if trial already started
      if (user.trialStatus === "active") {
        return res.status(400).json({ message: "Trial already active" });
      }
      
      // Check if trial already expired
      if (user.trialStatus === "expired") {
        return res.status(400).json({ message: "Trial already expired" });
      }
      
      // Start the trial
      const now = new Date();
      const updatedUser = await storage.updateUser(user.id, {
        trialStartedAt: now,
        trialStatus: "active",
        updatedAt: now
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to start trial" });
      }
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Start trial error:", error);
      res.status(500).json({ message: "Failed to start trial" });
    }
  });

  // Check trial status
  app.get("/api/trial-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const user = req.user as SelectUser;
      
      // If trial hasn't started yet
      if (user.trialStatus === "inactive" || !user.trialStartedAt) {
        return res.json({ 
          status: "inactive",
          message: "Trial not started yet",
          daysRemaining: 7
        });
      }
      
      // If trial is active, calculate days remaining
      if (user.trialStatus === "active") {
        const trialStartDate = new Date(user.trialStartedAt);
        const currentDate = new Date();
        
        // Calculate days elapsed since trial start
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const daysElapsed = Math.floor((currentDate.getTime() - trialStartDate.getTime()) / millisecondsPerDay);
        const daysRemaining = Math.max(0, 7 - daysElapsed);
        
        // If trial period is over but status not updated yet
        if (daysRemaining <= 0) {
          // Update user trial to expired
          await storage.updateUser(user.id, {
            trialStatus: "expired",
            updatedAt: new Date()
          });
          
          return res.json({ 
            status: "expired", 
            message: "Your 7-day trial has expired. Upgrade to continue using InfraAudit.",
            daysRemaining: 0
          });
        }
        
        return res.json({ 
          status: "active", 
          message: `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your trial.`,
          daysRemaining: daysRemaining
        });
      }
      
      // If trial has already expired
      if (user.trialStatus === "expired") {
        return res.json({ 
          status: "expired", 
          message: "Your 7-day trial has expired. Upgrade to continue using InfraAudit.",
          daysRemaining: 0
        });
      }
      
      // Default response for unexpected status
      return res.json({ 
        status: user.trialStatus,
        message: "Unknown trial status",
        daysRemaining: 0
      });
      
    } catch (error) {
      console.error("Trial status check error:", error);
      res.status(500).json({ message: "Failed to check trial status" });
    }
  });
}