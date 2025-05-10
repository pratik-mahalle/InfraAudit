package routes

import (
        "net/http"

        "github.com/cloudguard/api/internal/api/handlers"
        "github.com/cloudguard/api/internal/api/middleware"
        "github.com/cloudguard/api/internal/config"
        "github.com/cloudguard/api/internal/db"
        "github.com/go-chi/chi/v5"
        chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// SetupRouter sets up the HTTP router
func SetupRouter(cfg *config.Config, database *db.Database) http.Handler {
        r := chi.NewRouter()

        // Global middleware
        r.Use(chimiddleware.Logger)
        r.Use(chimiddleware.Recoverer)
        r.Use(chimiddleware.RealIP)
        r.Use(chimiddleware.StripSlashes)
        r.Use(chimiddleware.RequestID)
        r.Use(chimiddleware.AllowContentType("application/json"))
        r.Use(func(next http.Handler) http.Handler {
                return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                        w.Header().Set("Content-Type", "application/json")
                        next.ServeHTTP(w, r)
                })
        })

        // CORS middleware
        r.Use(func(next http.Handler) http.Handler {
                return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                        w.Header().Set("Access-Control-Allow-Origin", "*")
                        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                        
                        if r.Method == "OPTIONS" {
                                w.WriteHeader(http.StatusOK)
                                return
                        }
                        
                        next.ServeHTTP(w, r)
                })
        })

        // Create handlers
        authHandler := handlers.NewAuthHandler(database, cfg)
        resourcesHandler := handlers.NewResourcesHandler(database, cfg)
        notificationsHandler := handlers.NewNotificationsHandler(database, cfg)
        aiCostHandler := handlers.NewAICostHandler(database, cfg)

        // Public routes
        r.Group(func(r chi.Router) {
                r.Post("/api/login", authHandler.Login)
                r.Post("/api/register", authHandler.Register)
                
                // Health check
                r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
                        w.WriteHeader(http.StatusOK)
                        w.Write([]byte(`{"status":"OK"}`))
                })
        })

        // Protected routes
        r.Group(func(r chi.Router) {
                r.Use(middleware.AuthMiddleware(cfg))

                // Auth routes
                r.Post("/api/logout", authHandler.Logout)
                r.Get("/api/user", authHandler.GetCurrentUser)

                // Resources routes
                r.Get("/api/resources", resourcesHandler.GetResources)
                r.Get("/api/resources/{id}", resourcesHandler.GetResourceById)
                r.Get("/api/resources/provider/{provider}", resourcesHandler.GetResourcesByProvider)
                r.Get("/api/aws-resources", resourcesHandler.GetAWSResources)
                
                // Notifications routes
                r.Route("/api/notifications", func(r chi.Router) {
                        r.Post("/slack", notificationsHandler.SendSlackMessage)
                        r.Post("/test", notificationsHandler.SendTestNotification)
                        r.Get("/status", notificationsHandler.GetNotificationStatus)
                })
                
                // AI Cost routes
                r.Route("/api/ai-cost", func(r chi.Router) {
                        r.Get("/predict", aiCostHandler.PredictCosts)
                        r.Get("/optimize", aiCostHandler.GenerateOptimizations)
                        r.Get("/analyze-anomaly/{id}", aiCostHandler.AnalyzeAnomaly)
                })
                
                // TODO: Additional routes to implement
                // - Security drift routes
                // - Cost anomaly routes
                // - Alerts routes
                // - Recommendations routes
                // - Cloud provider routes
        })

        // If we're in development mode, serve static files
        if cfg.Environment == "development" {
                fileServer := http.FileServer(http.Dir("./public"))
                r.Handle("/*", http.StripPrefix("/", fileServer))
        }

        return r
}