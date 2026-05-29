declare module '*.css';

declare module '@mapbox/mapbox-gl-draw' {
  interface DrawOptions {
    displayControlsDefault?: boolean;
    controls?: Record<string, boolean>;
    styles?: any[];
    [key: string]: any;
  }
  interface DrawEvent {
    type: string;
    features: any[];
  }
  class MapboxDraw {
    constructor(options?: DrawOptions);
    add(geojson: any): string[];
    get(featureId: string): any;
    getSelected(): any;
    getAll(): any;
    delete(featureIds: string | string[]): void;
    deleteAll(): void;
    set(featureCollection: any): void;
    changeMode(mode: string, options?: any): void;
    on(event: string, handler: (e: DrawEvent) => void): void;
    setFeatureProperty(featureId: string, property: string, value: any): void;
    getSelectedIds(): string[];
    static modes: Record<string, any>;
  }
  export default MapboxDraw;
}
