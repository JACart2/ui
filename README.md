# JACart2 UI

The JACart2 UI is the cart-side web interface used by an operator to select destinations, monitor navigation, issue supported control requests, and interact with the JACart software stack.

The UI is a React and Vite application. In the normal cart setup, it is launched through the separate [`JACart2/docker_files`](https://github.com/JACart2/docker_files) repository rather than by running `npm run dev` directly on the host.

## Current Features

* Map-based destination selection
* Cart location and navigation status
* Trip progress and estimated arrival information
* Start, stop, resume, and destination confirmation controls
* Voice-command support
* Communication with ROS 2 services through ROSBridge
* Communication with the remote JACart dashboard
* Cart-specific runtime configuration

## Important Tools and Libraries

* [React](https://react.dev/) for the user interface
* [Vite](https://vite.dev/) for development and builds
* [Ant Design](https://ant.design/components/overview/) for UI components
* [MapLibre](https://maplibre.org/) for map rendering
* [React Map GL](https://visgl.github.io/react-map-gl/) as the React wrapper for MapLibre
* [OpenStreetMap](https://www.openstreetmap.org/) for map data
* [OSM Liberty](https://github.com/maputnik/osm-liberty) for the map style stored under `public/osm-liberty/`
* [PMTiles](https://www.npmjs.com/package/pmtiles) for loading static map tiles
* [Tilemaker](https://github.com/systemed/tilemaker/) for converting `.osm.pbf` files to `.pmtiles`
* [Osmconvert](https://wiki.openstreetmap.org/wiki/Osmconvert) for converting `.osm` files to `.osm.pbf`
* [ROSlib](https://github.com/RobotWebTools/roslibjs) for browser communication with ROSBridge
* [Socket.IO Client](https://socket.io/docs/v4/client-api/) for dashboard communication
* [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition) for browser speech recognition
* [Fuse.js](https://www.fusejs.io/) for fuzzy matching of spoken and typed destinations

## Repository Location

The Docker configuration bind-mounts the UI repository from:

```text
$HOME/ui
```

The recommended clone location is therefore:

```bash
cd "$HOME"
git clone https://github.com/JACart2/ui.git
cd ui
```

## Recommended Launch Method

The supported cart launch method is through the `docker_files` repository.

Do not normally launch the cart UI by running `npm run dev` directly from this repository. The Docker launcher:

* starts the frontend container
* starts the ROS 2 backend container
* uses host networking
* mounts this repository into `/root/ui`
* preserves frontend `node_modules` in a Docker volume
* passes cart and dashboard configuration into Vite
* waits for the UI to become available
* opens the UI at `http://localhost:5173`
* registers the cart with the remote dashboard

### Standard Cart Launch

From the `docker_files` repository:

```bash
cd "$HOME/docker_files"
./run.sh
```

With no arguments or environment overrides, the current defaults are:

```text
Cart name: james
Cart ID: james
ROS domain ID: 0
Dashboard host: 10.247.225.41
Dashboard API port: 8000
ROSBridge port: 9090
UI address: http://localhost:5173
```

The current IP addresses, ports, cart names, and ROS domain IDs are configuration defaults. They may change between machines, carts, networks, or deployments.

The launcher starts the following Docker Compose services:

```text
backend
frontend
```

The frontend service runs:

```bash
npm run dev
```

inside the container with this repository mounted at:

```text
/root/ui
```

The backend service runs the cart ROS 2 stack using:

```bash
ros2 launch cart_launch autonomous_launcher.launch.py
```

unless the backend command is overridden.

## Selecting a Cart and ROS Domain

The launcher accepts the cart name as its first argument and an optional ROS domain ID as its second argument:

```bash
./run.sh <cart-name> <ros-domain-id>
```

Examples:

```bash
./run.sh james 0
```

```bash
./run.sh madison 1
```

When the ROS domain is not supplied, the launcher currently uses these cart-specific defaults:

```text
james   -> ROS_DOMAIN_ID=0
madison -> ROS_DOMAIN_ID=1
```

Unknown cart names currently default to ROS domain `0` unless overridden.

These values are configuration defaults and should not be treated as permanent assignments.

## Runtime Configuration

The UI launch configuration is intentionally configurable. Environment variables take priority over the command-line defaults.

Example:

```bash
CART_NAME=madison \
CART_ID=madison \
ROS_DOMAIN_ID=1 \
SERVER_IP=10.247.225.41 \
API_PORT=8000 \
CART_PORT=9090 \
./run.sh
```

Supported launch variables include:

| Variable                  | Purpose                                           | Current default           |
| ------------------------- | ------------------------------------------------- | ------------------------- |
| `CART_NAME`               | Operator-facing cart name                         | First argument or `james` |
| `CART_ID`                 | Cart identifier passed to the ROS backend         | Same as `CART_NAME`       |
| `ROS_DOMAIN_ID`           | ROS 2 DDS domain                                  | Cart-specific default     |
| `SERVER_IP`               | Remote dashboard host                             | `10.247.225.41`           |
| `API_PORT`                | Remote dashboard API port                         | `8000`                    |
| `DASHBOARD_SCHEME`        | Dashboard protocol                                | `https`                   |
| `CART_PORT`               | Cart ROSBridge port registered with the dashboard | `9090`                    |
| `REREGISTER_INTERVAL_SEC` | Dashboard availability check interval             | `15`                      |
| `REGISTER_COOLDOWN_SEC`   | Minimum delay between successful registrations    | `15`                      |
| `BACKEND_COMMAND`         | Overrides the default ROS backend command         | Not set                   |
| `FRONTEND_COMMAND`        | Reserved frontend command override                | Not set                   |

The launcher derives the dashboard root from:

```text
DASHBOARD_ROOT=<scheme>://<server-ip>:<api-port>
```

For example:

```text
https://10.247.225.41:8000
```

It then exports the frontend variables:

```env
VITE_CART_NAME=<cart-name>
VITE_DASHBOARD_API_ROOT=<dashboard-root>/
```

These values are passed into the frontend container by Docker Compose.

Cart names, dashboard addresses, and ports should be changed through the launcher configuration rather than hardcoded into the UI source.

## Dashboard Registration

The `run.sh` launcher starts a background dashboard registration loop before launching the containers.

The registration system:

1. Builds the dashboard address from `DASHBOARD_SCHEME`, `SERVER_IP`, and `API_PORT`.
2. Checks whether the dashboard is reachable.
3. Registers the cart with the dashboard.
4. Continues checking the dashboard at a configurable interval.
5. Re-registers the cart when needed.

The cart is registered using information similar to:

```json
{
  "name": "james",
  "port": 9090
}
```

The port represents the cart's ROSBridge WebSocket port.

The dashboard may derive the cart's network address from the incoming registration request. The cart and dashboard must therefore be connected through a network configuration that allows the dashboard to reach the cart's ROSBridge server.

The current dashboard registration settings are temporary defaults and may be changed through environment variables.

## Production and Cart Operation

The standard production-style cart launch is:

```bash
cd "$HOME/docker_files"
./run.sh
```

This starts the cart backend and frontend UI without starting the separate LLM-backed anomaly detection service.

To start the cart stack with the anomaly detection service enabled:

```bash
ENABLE_ANOMALY_DETECTION=true ./run.sh
```

The anomaly detection service is separate from the UI. Enabling or disabling it should not change the normal frontend startup process.

## Development Launch Modes

The `docker_files` repository provides development modes for working on the backend and frontend.

### Backend Development

Run:

```bash
cd "$HOME/docker_files"
./dev-run-backend.sh james 0
```

This mode:

* starts the frontend normally
* keeps the backend container running without automatically launching the ROS stack
* opens the UI at `http://localhost:5173`
* attempts to attach VS Code to the backend container
* opens an interactive shell in `/root/dev_ws`
* sources the ROS 2 Jazzy and workspace environments

Use this mode when changing ROS 2 backend code while keeping the cart UI available.

The backend container is kept alive using:

```bash
tail -f /dev/null
```

instead of immediately launching the autonomous cart stack.

## Manual UI-Only Development

Running the UI directly is useful for isolated frontend development, but it does not replace the complete Docker cart launch.

### Prerequisites

* Node.js
* npm
* A reachable ROSBridge instance when testing ROS-backed features
* A reachable dashboard when testing dashboard integration

Install all dependencies from `package-lock.json`:

```bash
cd "$HOME/ui"
npm ci
```

Start the Vite development server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://localhost:5173
```

Do not install `regenerator-runtime` or `fuse.js` separately. They are already declared in `package.json` and are installed by:

```bash
npm ci
```

or:

```bash
npm install
```

For an isolated manual launch, runtime values can be supplied before starting Vite:

```bash
VITE_CART_NAME=james \
VITE_DASHBOARD_API_ROOT=https://10.247.225.41:8000/ \
npm run dev -- --host 0.0.0.0 --port 5173
```

Because Vite reads `VITE_` variables when the development server starts, restart the server after changing them.

Manual UI-only development may not provide all ROS 2, ROSBridge, dashboard-registration, networking, and backend behavior available through the Docker launcher.

## Docker Frontend Configuration

The frontend container is defined in the `docker_files` repository.

The current configuration uses:

```yaml
frontend:
  working_dir: /root/ui
  command: npm run dev
  network_mode: "host"
```

The UI source is mounted from:

```text
$HOME/ui
```

to:

```text
/root/ui
```

The frontend dependencies are stored in a Docker-managed volume at:

```text
/root/ui/node_modules
```

This prevents the container's Linux dependencies from being replaced by host-installed packages.

The frontend receives these variables from Docker Compose:

```env
VITE_CART_NAME
VITE_DASHBOARD_API_ROOT
```

Host networking allows the frontend to reach services running on the cart host through normal host ports, including ROSBridge and the Vite development server.

## Build and Validation

Create a production build:

```bash
npm run build
```

The build command runs TypeScript compilation followed by the Vite build:

```text
tsc && vite build
```

Run lint checks:

```bash
npm run lint
```

Preview a completed production build:

```bash
npm run preview
```

The normal Docker cart launch currently uses the Vite development server rather than `vite preview`.

## Voice Commands

The voice-command wake word is based on the cart name selected when launching the UI through the `docker_files` scripts.

For example:

```bash
./run.sh james 0
```

uses:

```text
James
```

as the wake word.

Launching another cart name:

```bash
./run.sh madison 1
```

uses:

```text
Madison
```

as the wake word.

A custom cart name can also be supplied:

```bash
./run.sh duke 2
```

which uses:

```text
Duke
```

as the wake word.

The cart name may also be configured through the environment:

```bash
CART_NAME=duke ROS_DOMAIN_ID=2 ./run.sh
```

The launcher passes the selected cart name to the frontend through:

```env
VITE_CART_NAME=<cart-name>
```

The UI uses this value as the wake word for voice commands.

Supported commands include:

* `<cart-name>, go to <location>` selects a destination.
* `confirm` confirms the selected destination and begins navigation.
* `cancel` clears the selected destination.
* `stop` requests a remote emergency stop during navigation.
* `resume` requests that navigation resume after a stop.

For example:

```text
James, go to Festival
```

```text
Madison, go to King Hall
```

```text
Duke, go to Chesapeake Hall
```

The wake word is therefore configurable at launch and is not permanently set to `James`.

Voice recognition depends on browser support and microphone permission.

## Troubleshooting

### The Docker frontend cannot find the UI source

Verify that this repository is located at:

```text
$HOME/ui
```

The current `docker_files/compose.yaml` bind-mounts that exact host path into:

```text
/root/ui
```

Check the directory:

```bash
ls -la "$HOME/ui"
```

### The UI does not open

Check the frontend container:

```bash
cd "$HOME/docker_files"
docker compose ps
docker compose logs -f frontend
```

Verify that port `5173` is available:

```bash
ss -lntp | grep 5173
```

Try opening the UI manually:

```text
http://localhost:5173
```

### The launch script waits forever for the frontend

The launcher waits until this request succeeds:

```bash
curl -fsS http://localhost:5173
```

Check the frontend logs:

```bash
docker compose logs -f frontend
```

Common causes include:

* dependency installation failures
* Vite startup errors
* port `5173` already being used
* an incorrect UI bind-mount path
* TypeScript or import errors
* incompatible branch combinations

### Changes are not visible

The source is bind-mounted, so normal source edits should be visible immediately through Vite hot reload.

If dependencies or the image changed, rebuild the frontend:

```bash
cd "$HOME/docker_files"
docker compose up frontend --build --force-recreate
```

If the `node_modules` volume contains outdated dependencies, reinstall inside the container:

```bash
docker compose exec frontend npm install
```

Only remove the Docker volume when a full dependency reset is required.

### The UI uses the wrong cart name

Stop the current launch and restart it with the correct argument:

```bash
./run.sh madison 1
```

or environment variables:

```bash
CART_NAME=madison ROS_DOMAIN_ID=1 ./run.sh
```

Check the configuration printed by the launcher:

```text
CART_NAME=
CART_ID=
ROS_DOMAIN_ID=
DASHBOARD_ROOT=
CART_PORT=
```

### Dashboard communication fails

Confirm the dashboard settings printed by the launch script.

Verify that the dashboard host is reachable:

```bash
curl -k https://10.247.225.41:8000/
```

Override the address when needed:

```bash
SERVER_IP=<dashboard-ip> \
API_PORT=<dashboard-port> \
./run.sh
```

If the dashboard uses HTTP rather than HTTPS:

```bash
DASHBOARD_SCHEME=http ./run.sh
```

Also verify:

* the cart and dashboard are connected to the expected network
* the dashboard certificate has been accepted when using self-signed HTTPS
* the dashboard API port is correct
* the dashboard allows requests from the cart UI origin
* the cart registration loop is running

### The cart is not appearing on the dashboard

Check the `run.sh` output for:

```text
[Dashboard] Connected to ...
[Dashboard] Registered ...
```

Verify the dashboard API manually:

```bash
curl -k \
  -X POST \
  https://10.247.225.41:8000/api/vehicles/register \
  -H "Content-Type: application/json" \
  -d '{"name":"james","port":9090}'
```

Verify that the dashboard can reach the cart's ROSBridge port.

On the cart:

```bash
ss -lntp | grep 9090
```

### ROS-backed controls do not work

Verify that:

* the backend container is running
* ROSBridge is running on the expected port
* the frontend and backend use compatible cart configuration
* `ROS_DOMAIN_ID` matches the cart's ROS 2 domain
* the required ROS 2 topics and services are available
* the browser can connect to ROSBridge
* the backend launch completed successfully

Inspect the containers with:

```bash
cd "$HOME/docker_files"
docker compose logs -f backend frontend
```

Check ROSBridge:

```bash
ros2 node list | grep rosbridge
```

Check port `9090`:

```bash
ss -lntp | grep 9090
```

### The wrong ROS domain is being used

The ROS domain selection priority is:

1. Existing `ROS_DOMAIN_ID` environment variable
2. Second command-line argument
3. Known cart default
4. Domain `0`

Check the current shell:

```bash
echo "$ROS_DOMAIN_ID"
```

An existing environment variable will override the command-line cart default.

Unset it when necessary:

```bash
unset ROS_DOMAIN_ID
./run.sh madison 1
```

### Docker permission errors

Add the user to the Docker group:

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

Then verify:

```bash
docker version
docker compose version
```

## Useful Docker Commands

List running services:

```bash
cd "$HOME/docker_files"
docker compose ps
```

View frontend logs:

```bash
docker compose logs -f frontend
```

View backend logs:

```bash
docker compose logs -f backend
```

Open a shell in the frontend:

```bash
docker compose exec frontend bash
```

Open a shell in the backend:

```bash
docker compose exec backend bash
```

Rebuild the frontend:

```bash
docker compose up frontend --build --force-recreate
```

Stop the cart stack:

```bash
docker compose down
```