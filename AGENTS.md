## Cursor Cloud specific instructions

- This repository now contains two services:
  - `frontend-service/`: Angular v22 frontend
  - `backend-service/`: Spring Boot backend using Java 21 and the Maven Wrapper
- The frontend requires Node.js `22.22.3` or newer because Angular CLI v22 does not run on older Node 22 patch releases.
- The backend can be started with `./mvnw spring-boot:run` from `backend-service/`.
- Before future agents run frontend builds or start the Angular dev server, verify the VM image provides a compatible Node.js version or install one locally for the session.
- The VM startup refresh script is still a no-op today, so if this repo continues to rely on Angular 22 it should be updated in the environment config to provision a compatible Node.js runtime by default.
