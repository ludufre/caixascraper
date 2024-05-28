build-docker:cleanup
	docker build -t ludufre/caixascraper:latest .

publish-image:
	docker push ludufre/caixascraper:latest

cleanup:
	find ./download/ ! -name '.gitignore' -type f -exec rm -f {} +