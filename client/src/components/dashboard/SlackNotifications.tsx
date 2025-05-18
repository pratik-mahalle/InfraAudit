import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SlackNotificationsProps {
  isConnected: boolean;
  alertsSentToday: number;
}

export function SlackNotifications({
  isConnected = true,
  alertsSentToday = 12,
}: SlackNotificationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">
          Slack Notifications
        </CardTitle>
        <Badge variant={isConnected ? "success" : "destructive"} className="text-xs">
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-gray-300 overflow-hidden">
          <div className="bg-[#4A154B] text-white p-2 text-sm font-medium">
            <div className="flex items-center">
              <svg viewBox="0 0 54 54" className="h-5 w-5 mr-2">
                <path
                  fill="currentColor"
                  d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
                />
                <path
                  fill="currentColor"
                  d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
                />
                <path
                  fill="currentColor"
                  d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
                />
                <path
                  fill="currentColor"
                  d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.25a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"
                />
              </svg>
              InfraAudit Alerts
            </div>
          </div>
          <div className="p-3 bg-white">
            <div className="mb-2">
              <span className="font-medium">🚨 Critical Alert:</span> Cost anomaly detected in EC2
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Unexpected 43% increase in compute costs over the last 24 hours. <a href="#" className="text-blue-600">View details →</a>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <span className="mr-2">InfraAudit</span>
              <span>Today at 9:15 AM</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">{alertsSentToday} alerts sent today</span>
          <a href="#" className="text-primary text-sm font-medium hover:underline">
            Configure
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
