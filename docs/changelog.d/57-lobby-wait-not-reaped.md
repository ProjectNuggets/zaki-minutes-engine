- **A notetaker waiting to be let in is no longer shut down by us while it waits (#57).** A notetaker
  is told to wait up to ten minutes in a meeting's waiting room, but the control plane's own cleanup
  sweep was ending the capture after about five — it treated a waiting notetaker's silence as a sign
  the notetaker had died, when a notetaker waiting for someone to click Admit has nothing to say by
  definition. The sweep now checks whether the notetaker is actually still running before ending a
  capture that has not yet joined, so a host who takes a few minutes to admit it no longer arrives to
  find the capture already over. A notetaker that has genuinely stopped is still cleaned up, so a
  capture that cannot proceed does not hang.
