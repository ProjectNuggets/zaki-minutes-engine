- **The ZAKI activation notice now says which capture features ZAKI actually enables (#55).** The notice
  said that ZAKI operates a deployment of this engine, which is true but told a reader nothing about how
  a ZAKI user captures a meeting. This engine ships calendar sync, an auto-join sweep, four platforms and
  an authenticated-bot mode; ZAKI production runs manual capture only, Google Meet only, and joins
  anonymously — so every ZAKI capture is started by hand and needs a human to admit the notetaker.
  [ZAKI-DOWNSTREAM.md](https://github.com/ProjectNuggets/zaki-minutes-engine/blob/main/ZAKI-DOWNSTREAM.md)
  now records that per-feature state, and the resulting capture failure rate, as a property of the
  activation choice rather than as a transient bug. Documentation of calendar sync and auto-join in this
  repository describes the engine's features, which is correct; it does not describe ZAKI's deployment.
