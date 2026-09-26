// Pure stage-completion detection for the 3-stage lesson wizard. Kept free of
// React/i18n so the rules are trivial to unit-test in isolation.

export interface ExercisesStageState {
  /** gradable exercises the learner has pressed "Kiểm tra" on */
  checkableCheckedCount: number;
  /** total gradable (answerable) exercises */
  checkableTotal: number;
  /** view-only exercises (drill / stroke order) opened */
  viewOnlySeenCount: number;
  /** total view-only exercises */
  viewOnlyTotal: number;
}

/** Exercises stage is done when every answerable exercise is checked and
 * every view-only exercise has been opened. */
export function isExercisesStageComplete(state: ExercisesStageState): boolean {
  return (
    state.checkableCheckedCount >= state.checkableTotal &&
    state.viewOnlySeenCount >= state.viewOnlyTotal
  );
}
