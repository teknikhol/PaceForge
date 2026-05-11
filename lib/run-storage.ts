export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export const RunStorage = {
  lastRunRoute: [] as RouteCoordinate[],
  
  setLastRunRoute(route: RouteCoordinate[]) {
    this.lastRunRoute = route;
  },
  
  getLastRunRoute(): RouteCoordinate[] {
    return this.lastRunRoute;
  },
  
  clearLastRunRoute() {
    this.lastRunRoute = [];
  },
};
