import { Group } from 'three';
import type { GlobeInstance } from 'globe.gl';

const roots = new WeakMap<GlobeInstance, { group: Group; owners: number }>();

/** A shared Globe.gl root sharing the planet transformation across layers. */
export function acquireEarthAnalysisRoot(globe: GlobeInstance) {
  let entry = roots.get(globe);
  if (!entry) {
    const group = new Group();
    group.name = 'earth-analysis-root';
    entry = { group, owners: 0 };
    roots.set(globe, entry);
    globe.customThreeObject(() => group).customThreeObjectUpdate(() => {}).customLayerData([{}]);
  }
  entry.owners += 1;
  let released = false;
  return {
    group: entry.group,
    release(): void {
      if (released) return;
      released = true;
      entry.owners -= 1;
      if (entry.owners === 0) {
        globe.customLayerData([]);
        entry.group.removeFromParent();
        roots.delete(globe);
      }
    },
  };
}
