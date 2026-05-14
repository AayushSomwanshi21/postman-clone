export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function buildHighlightHtml(template: string, vars: Record<string, string>): string {
  return template
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\{\{(\w+)\}\}/g, (match, key) =>
      `<span style="color:${key in vars ? '#e07b39' : '#e05252'}">${match}</span>`
    )
    .replace(/(?<=\/):(\w+)|(?<!\{)\{(\w+)\}(?!\})/g, (match) =>
      `<span style="color:#e07b39">${match}</span>`
    );
}
