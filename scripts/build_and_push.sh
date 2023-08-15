
tag=${1:-latest}

docker login --username=$DOCKER_HUB_USER --password=$DOCKER_HUB_TOKEN

docker run --privileged --rm tonistiigi/binfmt --install all

# echo "$DOCKER_HUB_TOKEN" | docker login --username $DOCKERHUB_USERNAME --password-stdin $DOCKER_HUB_REPO

docker buildx rm mybuild || true
docker buildx create --use --name mybuild default || true

docker buildx build --platform linux/arm64,linux/amd64 --push -t alexiscaspell/my-cv:$tag .