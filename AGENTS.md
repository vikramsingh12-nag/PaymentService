## Cursor Cloud specific instructions

- As of the current repository state, this repo contains only `README.md` from the initial commit and does not define any application code, dependency manifests, lint targets, test targets, build targets, or runnable services.
- The VM startup refresh script is intentionally a no-op (`true`) because there are no repository-managed dependencies to install yet.
- Before future agents try to start services or run end-to-end flows, first verify whether application source and setup docs have been added in a newer commit; if so, update this file and the VM startup script to match the new source of truth.
