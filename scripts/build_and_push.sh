
tag=${1:-latest}

docker buildx build --platform linux/arm64,linux/amd64 --push -t alexiscaspell/my-cv:$tag .