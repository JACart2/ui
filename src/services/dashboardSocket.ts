import io from "socket.io-client";

const DASHBOARD_ROOT =
  import.meta.env.VITE_DASHBOARD_API_ROOT || "https://10.247.225.41:8000/";

console.log(
  "[Dashboard Socket] connecting to:",
  DASHBOARD_ROOT.replace(/\/$/, ""),
);

const socket = io(DASHBOARD_ROOT.replace(/\/$/, ""), {
  transports: ["polling"],
});

function normalizeCartName(name: string): string {
  return name.trim().toLowerCase();
}

socket.on("connect", () => {
  console.log("[Dashboard Socket] connected:", socket.id);
});

socket.on("disconnect", (reason: string) => {
  console.log("[Dashboard Socket] disconnected:", reason);
});

socket.io.on("reconnect_attempt", (attempt: number) => {
  console.log(
    "[Dashboard Socket] reconnect_attempt:",
    attempt,
  );
});

socket.on("connect_error", (error: Error) => {
  console.error(
    "[Dashboard Socket] connect_error:",
    error.message,
    error,
  );
});

type CameraName = "front" | "rear";


export const dashboardSocket = {
  publishCameraFrame(
    cartName: string,
    camera: CameraName,
    imageData: string,
  ): void {
    const name = normalizeCartName(cartName);

    console.log(
      "[Dashboard Socket] publishing camera-frame:",
      {
        name,
        camera,
        length: imageData.length,
      },
    );

    socket.emit("camera-frame", {
      name,
      camera,
      data: imageData,
    });
  },
};