# SuiWeb Demos

This directory contains some demos, showcasing the functionality of SuiWeb.

To run the demos, a local web server is needed, as scripts are imported as JavaScript modules, which is only allowed for websites loaded via the `http` or `https` scheme.

To run a local web server, execute `npx serve` in this directory, open the URL shown in your browser and navigate to the desired demo. Note that most demos run directly using `npx serve`. For demos containing a `package.json` file, it might be needed, however, to bundle them before running. This can usually be done by executing `npm run dev` inside the directory of the corresponding demo.
