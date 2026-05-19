const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// supabase-js v2.49+ has an optional dynamic import of @opentelemetry/api
// that Metro can't resolve. Stub it out as an empty module.
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === "@opentelemetry/api") {
      return { type: "empty" };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
