/**
 * Help popup service — the single entry point for contextual help.
 *
 * Usage from any call site:
 *   import { js_help } from '../help/js_helpService.js';
 *   js_help.fn_showHelpFor('map3d');
 *
 * Behaviour:
 *   - silently returns when the topic is unknown, its markdown is
 *     missing, or the user previously checked "don't show again"
 *     (unless p_options.force is true)
 *   - on success opens 'helpDialog' through js_dialogs, which renders
 *     the topic's markdown as HTML with a "don't show again" checkbox
 */

import { HELP_TOPICS } from './js_helpTopics.js';
import { fn_loadHelpTopic } from './js_helpLoader.js';
import { js_dialogs } from '../app/dialogService.js';
import { js_localStorage } from '../state/js_localStorage.js';

export const js_help = {

    /**
     * Show the help popup for a topic.
     * @param {string} p_topicId - key in HELP_TOPICS (e.g. 'map3d')
     * @param {object} [p_options]
     * @param {boolean} [p_options.force] - show even if the user suppressed it
     */
    async fn_showHelpFor(p_topicId, p_options = {}) {
        if (!p_topicId) return;

        const v_topic = HELP_TOPICS[p_topicId];
        if (!v_topic) return;

        if (p_options.force !== true &&
            js_localStorage.fn_getHelpSuppressed(p_topicId) === true) {
            return;
        }

        const v_page = await fn_loadHelpTopic(v_topic.md, js_localStorage.fn_getLanguage());
        if (v_page === null) return;

        js_dialogs.fn_showHelpDialog({
            p_topicId: p_topicId,
            p_title: v_page.title || p_topicId,
            p_html: v_page.html,
        });
    },

    /**
     * True when the user checked "don't show again" for this topic.
     * @param {string} p_topicId
     * @returns {boolean}
     */
    fn_isHelpSuppressed(p_topicId) {
        return js_localStorage.fn_getHelpSuppressed(p_topicId);
    },
};
