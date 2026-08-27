const fs = require("fs");
const path = require("path");

const frontendRoot = path.join(__dirname, "..");
const packageJsonPath = path.join(frontendRoot, "package.json");
const publicPath = path.join(frontendRoot, "public");
const versionFilePath = path.join(publicPath, "version.json");

try {
  // Read package.json
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
  );

  // Get the exact application version
  const version = packageJson.version;

  if (!version) {
    throw new Error(
      "No version was found in frontend/package.json"
    );
  }

  // Make sure public folder exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, {
      recursive: true
    });
  }

  // Create version.json
  const versionData = {
    version: version
  };

  fs.writeFileSync(
    versionFilePath,
    JSON.stringify(versionData, null, 2),
    "utf8"
  );

  console.log(
    `✅ BusGo version ${version} generated successfully.`
  );

  console.log(
    `📄 Created: ${versionFilePath}`
  );

} catch (error) {
  console.error(
    "❌ Failed to generate application version."
  );

  console.error(error);

  process.exit(1);
}