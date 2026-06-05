import type { AdminWeatherOverview, WeatherThresholds } from "../types";
import { buildTestWeatherOverview } from "../features/weather/testWeatherFixture";
import { requestJson } from "./client";

const ENABLE_TEST_WEATHER_MOCK = import.meta.env.VITE_ENABLE_TEST_WEATHER_MOCK === "true";

export async function getAdminWeatherOverview(projectId: string): Promise<AdminWeatherOverview> {
  try {
    return await requestJson<AdminWeatherOverview>(`/api/admin/projects/${encodeURIComponent(projectId)}/weather`);
  } catch (error) {
    if (ENABLE_TEST_WEATHER_MOCK) {
      return buildTestWeatherOverview(projectId);
    }

    throw error;
  }
}

export async function updateAdminWeatherStation(station: { projectId: string; name?: string; latitude: number; longitude: number }): Promise<AdminWeatherOverview> {
  const { projectId, ...body } = station;
  return requestJson<AdminWeatherOverview>(`/api/admin/projects/${encodeURIComponent(projectId)}/weather/station`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminWeatherThresholds(thresholds: WeatherThresholds & { projectId: string }): Promise<AdminWeatherOverview> {
  const { projectId, ...body } = thresholds;
  return requestJson<AdminWeatherOverview>(`/api/admin/projects/${encodeURIComponent(projectId)}/weather/thresholds`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
