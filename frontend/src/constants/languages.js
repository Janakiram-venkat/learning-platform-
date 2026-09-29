// Per-language bits the editor panels need: what to call it, which Monaco
// grammar to load, and what a downloaded file should be named.
//
// A course declares its language in `course.json` ("language": "java"). Courses
// written before this existed have no such field, so Python is the default and
// nothing about them changes.

export const LANGUAGES = {
  python: { label: 'Python', monaco: 'python', extension: 'py' },
  java: { label: 'Java', monaco: 'java', extension: 'java' },
};

export const DEFAULT_LANGUAGE = 'python';

/** The language id a course is taught in, falling back to Python. */
export function courseLanguage(course) {
  const id = course?.language;
  return id && LANGUAGES[id] ? id : DEFAULT_LANGUAGE;
}

/** Metadata for a language id, falling back to Python's. */
export function languageMeta(id) {
  return LANGUAGES[id] || LANGUAGES[DEFAULT_LANGUAGE];
}

/**
 * The filename to show in the editor toolbar and use for downloads.
 * Java is compiled from a file named after its public class, so a Java download
 * must be `Main.java` for `javac` to accept it — `project.java` would not build.
 */
export function editorFilename(languageId, stem = 'main') {
  const meta = languageMeta(languageId);
  return languageId === 'java' ? 'Main.java' : `${stem}.${meta.extension}`;
}
