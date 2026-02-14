/**
 * ClawHub Formatters — output formatting for CLI results.
 *
 * Default (and currently only) format is JSON to stdout.
 * Table and Markdown formatters are reserved for future use (P3).
 */

/**
 * Print data as pretty JSON to stdout.
 * @param {*} data - Any JSON-serializable value
 */
export function toJson(data) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Print a message to stderr (for logging / errors).
 * @param {string} msg
 */
export function toStderr(msg) {
    process.stderr.write(msg + '\n');
}
