GIT_COMMIT_HASH=$$(git rev-parse --short HEAD)
DockerImage=asia-south1-docker.pkg.dev/sounish-cloud-workstation/sounish-cloud-workstation/lofiloops.sh

.PHONY: build-docker-img
build-docker-img:
	echo "Building Latest Docker image"
	docker build --platform linux/amd64 -t $(DockerImage):$(GIT_COMMIT_HASH) -f Dockerfile .

	echo "Authenticating the Google Artifact registry"
	gcloud auth configure-docker asia-south1-docker.pkg.dev

	echo "Preparing to push the docker image"
	docker push $(DockerImage):$(GIT_COMMIT_HASH)


.PHONY: deploy
deploy: build-docker-img
	echo "Deploying the latest docker image to Google cloud run"
	gcloud run deploy lofiloops \
	--image="$(DockerImage):$(GIT_COMMIT_HASH)" \
	--allow-unauthenticated \
	--port=80 \
	--service-account=797087556919-compute@developer.gserviceaccount.com \
	--max-instances=3 \
	--region=asia-south1


.PHONY: gifs
gifs: gif-downloader gif-dedupe

.PHONY: gif-downloader
gif-downloader:
	mkdir -p downloaded_gifs
	@for i in $$(seq 1 100); do \
		( \
			n=$$((i + 134)); \
			curl -L --fail --silent --show-error \
				"https://example.gifs.com/smt" \
				-o "downloaded_gifs/gifs_$${n}.gif" \
		) & \
	done; \
	wait


gif-dedupe:
	@echo "Checking downloaded GIFs against ./src/assets/..."
	@for file in downloaded_gifs/*.gif; do \
		[ -f "$$file" ] || continue; \
		hash=$$(shasum -a 256 "$$file" | awk '{print $$1}'); \
		found=0; \
		for existing in ./src/assets/*; do \
			[ -f "$$existing" ] || continue; \
			existing_hash=$$(shasum -a 256 "$$existing" | awk '{print $$1}'); \
			if [ "$$hash" = "$$existing_hash" ]; then \
				echo "DELETE: $$file (duplicate of $$existing)"; \
				rm -f "$$file"; \
				found=1; \
				break; \
			fi; \
		done; \
		if [ "$$found" -eq 0 ]; then \
			echo "KEEP:   $$file"; \
		fi; \
	done

	cp downloaded_gifs/* ./src/assets/
	rm -rf downloaded_gifs