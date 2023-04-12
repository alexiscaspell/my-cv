
tag=${1:-latest}
# docker buildx create --append --name mybuild default
docker buildx build --platform linux/arm64,linux/amd64 --push -t alexiscaspell/my-cv:$tag .