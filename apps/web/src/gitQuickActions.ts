import {
  MAX_CUSTOM_QUICK_ACTIONS,
  MAX_QUICK_ACTION_LABEL_LENGTH,
  MAX_QUICK_ACTION_PROMPT_LENGTH,
  type CustomQuickAction,
} from "@t3tools/contracts/settings";
import { AI_GIT_ACTIONS, type AiGitAction } from "./components/GitActionsControl.logic";

export { MAX_CUSTOM_QUICK_ACTIONS, MAX_QUICK_ACTION_LABEL_LENGTH, MAX_QUICK_ACTION_PROMPT_LENGTH };

export function normalizeCustomQuickActions(
  actions: readonly CustomQuickAction[] | null | undefined,
): CustomQuickAction[] {
  if (!actions) {
    return [];
  }

  const seen = new Set<string>();
  const result: CustomQuickAction[] = [];
  for (const action of actions) {
    const id = action.id.trim();
    const label = action.label.trim();
    const prompt = action.prompt.trim();

    if (
      !id ||
      !label ||
      !prompt ||
      label.length > MAX_QUICK_ACTION_LABEL_LENGTH ||
      prompt.length > MAX_QUICK_ACTION_PROMPT_LENGTH ||
      seen.has(id)
    ) {
      continue;
    }

    seen.add(id);
    result.push({
      ...action,
      id,
      label,
      prompt,
      editBeforeSend: action.editBeforeSend === true,
    });
    if (result.length >= MAX_CUSTOM_QUICK_ACTIONS) {
      break;
    }
  }

  return result;
}

export function getAllAskClaudeActions(
  customQuickActions: readonly CustomQuickAction[] | null | undefined,
): AiGitAction[] {
  return [...AI_GIT_ACTIONS, ...normalizeCustomQuickActions(customQuickActions)];
}
