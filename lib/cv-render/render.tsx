/**
 * Dispatcher for the @react-pdf templates.
 *
 * `renderCVToPdfBuffer` is the one entry point the API route + scripts call.
 * Adding a new template = (1) write the component, (2) add it to TEMPLATES.
 * The route layer never imports templates directly so we avoid accidentally
 * bundling all of them onto the client when one is added.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { ModernTemplate } from "./templates/modern";
import { ClassicTemplate } from "./templates/classic";
import { MinimalTemplate } from "./templates/minimal";
import type { CVData, TemplateId } from "./types";

const TEMPLATES: Record<TemplateId, (props: { data: CVData }) => React.JSX.Element> = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
};

export async function renderCVToPdfBuffer(data: CVData, templateId: TemplateId): Promise<Buffer> {
  const Template = TEMPLATES[templateId];
  if (!Template) throw new Error(`Unknown template: ${templateId}`);
  // renderToBuffer is a server-only helper from @react-pdf/renderer that
  // returns a Node Buffer of the PDF bytes. It's synchronous to the React
  // layer but returns a promise here because internally it streams the doc.
  return renderToBuffer(<Template data={data} />);
}
