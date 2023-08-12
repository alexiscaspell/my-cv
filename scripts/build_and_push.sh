
tag=${1:-latest}

docker run --privileged --rm tonistiigi/binfmt --install all

docker buildx rm mybuild || true
docker buildx create --use --name mybuild default || true

docker buildx build --platform linux/arm64,linux/amd64 --push -t alexiscaspell/my-cv:$tag .