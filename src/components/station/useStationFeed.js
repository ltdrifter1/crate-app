import { useMemo, useState } from "react";
import {
  buildStationTicker,
  listDedications,
  stationDaypart,
} from "../../lib/station";

/** Hook helper — ticker + daypart + dedications for station surfaces. */
export function useStationFeed({
  countdown = [],
  communityMixTitle = null,
  show = null,
  nextShow = null,
  bumper = null,
} = {}) {
  const daypart = useMemo(() => stationDaypart(new Date()), []);
  const [dedicationFlash, setDedicationFlash] = useState(null);
  const [dedications, setDedications] = useState(() => listDedications(8));

  const ticker = useMemo(
    () => buildStationTicker({
      countdown,
      daypart,
      communityMixTitle,
      dedication: dedications[0] || null,
      show,
      nextShow,
      bumper,
    }),
    [countdown, daypart, communityMixTitle, dedications, show, nextShow, bumper]
  );

  const pushDedication = (entry) => {
    setDedications(listDedications(8));
    setDedicationFlash(entry);
  };

  return {
    daypart,
    ticker,
    dedications,
    dedicationFlash,
    setDedicationFlash,
    pushDedication,
  };
}
