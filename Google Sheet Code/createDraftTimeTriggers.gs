const POLLS_PER_MINUTE = 4;

/**
 * Creates a single every-minute trigger that polls draft results
 */
function createDraftTimeTriggers() {
  deleteDraftTimeTriggers();
  ScriptApp.newTrigger("pollDraftResults").timeBased().everyMinutes(1).create();
}

function deleteDraftTimeTriggers() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "pollDraftResults")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

/**
 * Polls several times within one minute, since triggers can't run more often than that
 */
function pollDraftResults() {
  const secondsBetweenPolls = 60 / POLLS_PER_MINUTE;
  for (let i = 0; i < POLLS_PER_MINUTE; i++) {
    getDraftResults();
    if (i < POLLS_PER_MINUTE - 1) {
      Utilities.sleep(secondsBetweenPolls * 1000);
    }
  }
}
