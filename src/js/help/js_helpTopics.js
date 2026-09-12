/**
 * Help topic registry — maps a topic id to its markdown file.
 * The markdown lives in public/help/<lang>/<md>.md so help text is
 * editable without a rebuild and translatable per language folder
 * (falls back to 'en' when a language file is missing).
 *
 * To add help for a new feature:
 *   1. drop public/help/en/<topic>.md
 *   2. add one entry below
 *   3. call js_help.fn_showHelpFor('<topic>') from the feature
 */

export const HELP_TOPICS = {
    map3d: { md: 'map3d' },
};
