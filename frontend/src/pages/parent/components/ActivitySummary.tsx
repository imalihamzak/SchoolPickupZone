import { useEffect, useState } from "react";
import axios from "axios";
import { Activity as ActivityIcon, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";
import "./parent-workspace.css";

interface Activity {
  id: number;
  type: string;
  date: string;
  time: string;
  guard: string;
  status: string;
}

export default function ActivitySummary() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/pickups`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const mapped = (Array.isArray(res.data) ? res.data : []).map((log: any) => {
          const pickupDate = new Date(log.pickup_time);
          return {
            id: log.id,
            type: "pickup",
            date: Number.isNaN(pickupDate.getTime())
              ? "No date"
              : pickupDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
            time: Number.isNaN(pickupDate.getTime())
              ? "No time"
              : pickupDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            guard: log.guardian_name || log.guard_name || "Authorized guardian",
            status: log.status || "Completed",
          };
        });

        setActivities(mapped);
        setLoading(false);
      } catch (err: any) {
        if (isQuietEmptyStateError(err)) {
          setActivities([]);
          setLoading(false);
          return;
        }
        toast.error(err.response?.data?.error || "Failed to fetch pickup logs");
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="pz-parent-workspace-view">
      <div className="pz-parent-workspace-heading">
        <div>
          <h2 className="pz-parent-workspace-title">Recent Activity</h2>
          <div className="pz-parent-workspace-copy">Latest pickup verification events for your family.</div>
        </div>
        <span className="pz-parent-workspace-badge">
          <span className="pz-parent-workspace-dot" />
          {activities.length} event{activities.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="pz-parent-workspace-loading">Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className="pz-parent-empty-card">
          <div className="pz-parent-empty-icon">
            <ActivityIcon size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="pz-parent-profile-name">No recent activity</div>
            <div className="pz-parent-workspace-copy">Pickup records will appear here when available.</div>
          </div>
        </div>
      ) : (
        <div className="pz-parent-activity-list">
          {activities.map((activity) => (
            <div key={activity.id} className="pz-parent-activity-row">
              <div className="pz-parent-activity-icon">
                {activity.type === "pickup" ? (
                  <ShieldCheck size={18} aria-hidden="true" />
                ) : (
                  <CalendarDays size={18} aria-hidden="true" />
                )}
              </div>
              <div className="pz-parent-activity-main">
                <div className="pz-parent-activity-title">Pickup by {activity.guard}</div>
                <div className="pz-parent-activity-meta">
                  <Clock3 size={14} aria-hidden="true" />
                  {activity.date} at {activity.time}
                </div>
              </div>
              <span
                className={`pz-parent-activity-status ${
                  activity.status.toLowerCase() === "completed" ? "" : "pending"
                }`}
              >
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
