import { OpenRPC, MethodObject } from "@open-rpc/meta-schema";
import { Server, IServerOptions, Router } from "@open-rpc/server-js";
import _ from "lodash";
import { IMethodMapping } from "@open-rpc/server-js/build/router";
import { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";

const makePrefix = (sluggedDocumentTitle: string, version: string) => {
  return `${_.camelCase(sluggedDocumentTitle)}-${version}-`;
};

const createServiceMethodMapping = (s: Server, document: OpenRPC): IMethodMapping => {
  return {
    mock: async (openrpcDocument: OpenRPC) => {
      const prefix = makePrefix(openrpcDocument.info.title, openrpcDocument.info.version);
      const prefixedOpenRPCDocument = {
        ...openrpcDocument,
        methods: _.map(
          openrpcDocument.methods,
          (method: MethodObject): MethodObject => ({ ...method, name: `${prefix}${method.name}` })),
      } as OpenRPC;

      const parsedDoc = await parseOpenRPCDocument(prefixedOpenRPCDocument);
      const router = s.addRouter(prefixedOpenRPCDocument, { mockMode: true });

      setTimeout(() => s.removeRouter(router), 15 * 60 * 1000);

      return prefix.slice(0, -1);
    },
  };
};

export const serviceMode = (port: number, openrpcDocument: OpenRPC) => {
  const options = {
    openrpcDocument,
    transportConfigs: [
      {
        options: {
          middleware: [
            (req: any, res: any, next: () => void) => {
              if (req.url === "/") { return next(); }

              const url: string = req.url.replace("/", "");
              const [title, version] = url.split("-");
              const prefix = makePrefix(title, version);

              req.body.method = `${prefix}${req.body.method}`;
              return next();
            },
          ],
          port,
        },
        type: "HTTPTransport",
      },
    ],
  } as IServerOptions;

  const serviceServer = new Server(options);

  const methodMapping = createServiceMethodMapping(serviceServer, openrpcDocument);
  serviceServer.addRouter(openrpcDocument, methodMapping);

  return serviceServer;
};

const server = (port: number, openrpcDocument: OpenRPC) => {

  const options = {
    methodMapping: { mockMode: true },
    openrpcDocument,
    transportConfigs: [
      {
        options: {
          middleware: [],
          port,
        },
        type: "HTTPTransport",
      },
    ],
  } as IServerOptions;

  return new Server(options);
};

export default server;
