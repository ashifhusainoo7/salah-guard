/**
 * Bug 3: Verify DndAlarmScheduler template includes the guard that prevents
 * re-enabling DND when the user has manually disabled it during a prayer window.
 *
 * The in-progress prayer window block in scheduleAll() must:
 * 1. Check currentInterruptionFilter before setting PRIORITY mode
 * 2. Skip re-enabling if filter is INTERRUPTION_FILTER_ALL (user manually turned DND off)
 * 3. Only re-enable DND if it's already in a non-ALL state
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withDndModule = require('../plugins/withDndModule');

// The plugin exports a function; we need the template string from the module scope.
// Since the templates are embedded as constants in the module, we extract them
// by reading the source file directly.
const fs = require('fs');
const path = require('path');

const pluginSource = fs.readFileSync(
  path.join(__dirname, '..', 'plugins', 'withDndModule.js'),
  'utf8',
);

// Extract the DND_ALARM_SCHEDULER_KT template
const schedulerMatch = pluginSource.match(
  /const DND_ALARM_SCHEDULER_KT = `([\s\S]*?)`;/,
);
const schedulerTemplate = schedulerMatch ? schedulerMatch[1] : '';

// Extract the DND_ALARM_RECEIVER_KT template
const receiverMatch = pluginSource.match(
  /const DND_ALARM_RECEIVER_KT = `([\s\S]*?)`;/,
);
const receiverTemplate = receiverMatch ? receiverMatch[1] : '';

// Extract the DND_MODULE_KT template
const moduleMatch = pluginSource.match(
  /const DND_MODULE_KT = `([\s\S]*?)`;/,
);
const moduleTemplate = moduleMatch ? moduleMatch[1] : '';

describe('Bug 3: DndAlarmScheduler - Manual DND disable guard', () => {
  it('should have extracted the scheduler template', () => {
    expect(schedulerTemplate.length).toBeGreaterThan(0);
    expect(schedulerTemplate).toContain('object DndAlarmScheduler');
  });

  it('checks currentInterruptionFilter before re-enabling DND in prayer window', () => {
    // The critical fix: before calling setInterruptionFilter(PRIORITY),
    // the code must check if the current filter is INTERRUPTION_FILTER_ALL
    expect(schedulerTemplate).toContain('currentInterruptionFilter');
    expect(schedulerTemplate).toContain('INTERRUPTION_FILTER_ALL');
  });

  it('skips re-enabling DND when user manually disabled it', () => {
    // Should contain the conditional guard that skips DND re-enable
    expect(schedulerTemplate).toContain(
      'user manually disabled DND, skipping',
    );
  });

  it('only sets PRIORITY filter when DND is not manually off', () => {
    // The in-progress window block should have a conditional structure:
    // if (filter == ALL) { skip } else { set PRIORITY }
    const inProgressBlock = schedulerTemplate.substring(
      schedulerTemplate.indexOf('startMillis <= now && endMillis > now'),
    );
    expect(inProgressBlock).toBeTruthy();

    // The INTERRUPTION_FILTER_ALL check must come BEFORE setInterruptionFilter(PRIORITY)
    const filterAllIndex = inProgressBlock.indexOf('INTERRUPTION_FILTER_ALL');
    const setPriorityIndex = inProgressBlock.indexOf(
      'INTERRUPTION_FILTER_PRIORITY',
    );
    expect(filterAllIndex).toBeGreaterThan(-1);
    expect(setPriorityIndex).toBeGreaterThan(-1);
    expect(filterAllIndex).toBeLessThan(setPriorityIndex);
  });

  it('still enables DND when filter is not ALL (DND already active or set by system)', () => {
    // The else branch should still call setInterruptionFilter(PRIORITY)
    const inProgressBlock = schedulerTemplate.substring(
      schedulerTemplate.indexOf('startMillis <= now && endMillis > now'),
    );
    expect(inProgressBlock).toContain(
      'setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)',
    );
    expect(inProgressBlock).toContain('DND enabled');
  });

  it('stores prayer context in SharedPreferences only when DND is re-enabled', () => {
    // The prefs.edit() that saves current_dnd_prayer should be in the else branch
    // (when DND is actually re-enabled), not in the skip branch
    const inProgressBlock = schedulerTemplate.substring(
      schedulerTemplate.indexOf('startMillis <= now && endMillis > now'),
    );

    // Find the "skipping" log and "DND enabled" log positions
    const skippingIdx = inProgressBlock.indexOf('skipping');
    const enabledIdx = inProgressBlock.indexOf('DND enabled');
    const prefsEditIdx = inProgressBlock.indexOf('current_dnd_prayer');

    // SharedPreferences write must be after "DND enabled" (in the else branch)
    expect(prefsEditIdx).toBeGreaterThan(enabledIdx);
    // SharedPreferences write must NOT be in the skip branch
    expect(prefsEditIdx).toBeGreaterThan(skippingIdx);
  });
});
