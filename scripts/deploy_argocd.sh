# clone gitops repository, locate my-cv backend and change the image tag, then commit and push
# to the gitops repository
# Usage: ./deploy_argocd.sh <gitops-repo-url> <gitops-repo-branch> <my-cv-backend-image-tag>
# Example: ./deploy_argocd.sh
#
# Required environment variables:
# - GITOPS_REPO_URL
# - GITOPS_REPO_BRANCH
# - MY_CV_BACKEND_IMAGE_TAG
# - GITOPS_REPO_USERNAME
# - GITOPS_REPO_PASSWORD

set -e

GITOPS_REPO_URL=$1
GITOPS_REPO_BRANCH=$2
MY_CV_BACKEND_IMAGE_TAG=$3
GITOPS_REPO_USERNAME=$4
GITOPS_REPO_PASSWORD=$5

# Set github credentials
echo "Setting github credentials"
git config --global credential.helper store
echo "https://$GITOPS_REPO_USERNAME:${GITOPS_REPO_PASSWORD}" > ~/.git-credentials

# Clone the gitops repository
echo "Cloning gitops repository"
git clone $GITOPS_REPO_URL

# Get repository name
REPO_NAME=$(echo $GITOPS_REPO_URL | cut -d "/" -f 5 | cut -d "." -f 1)
cd $REPO_NAME

# Checkout the branch
echo "Checking out branch $GITOPS_REPO_BRANCH"
git checkout $GITOPS_REPO_BRANCH

# Locate the my-cv backend deployment
echo "Locating my-cv backend deployment"
MY_CV_BACKEND_DEPLOYMENT=$(grep -r "my-cv-backend" . | grep "kind: Deployment" | cut -d ":" -f 1)

# Change the image tag
echo "Changing the image tag to $MY_CV_BACKEND_IMAGE_TAG"
sed -i "s|image: .*|image: ghcr.io/ahmedwab/my-cv-backend:$MY_CV_BACKEND_IMAGE_TAG|g" $MY_CV_BACKEND_DEPLOYMENT

# Commit and push
echo "Committing and pushing changes"
git add .
git commit -m "Update my-cv backend image tag to $MY_CV_BACKEND_IMAGE_TAG"
git push origin $GITOPS_REPO_BRANCH

cd ..
rm -rf gitops

echo "Successfully deployed my-cv backend with image tag $MY_CV_BACKEND_IMAGE_TAG"

exit 0