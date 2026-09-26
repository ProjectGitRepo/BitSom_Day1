import type { SourceConnector } from "./types.js";
import { workdayConnector } from "./workdayConnector.js";
import { greenhouseConnector } from "./greenhouseConnector.js";
import { jiraConnector } from "./jiraConnector.js";
import { latticeConnector } from "./latticeConnector.js";
import { cornerstoneConnector } from "./cornerstoneConnector.js";
import { skillsTaxonomyConnector } from "./skillsTaxonomyConnector.js";

export const connectors: SourceConnector[] = [
  workdayConnector,
  greenhouseConnector,
  jiraConnector,
  latticeConnector,
  cornerstoneConnector,
  skillsTaxonomyConnector
];

export function getConnector(id: string): SourceConnector | undefined {
  return connectors.find((c) => c.id === id);
}
