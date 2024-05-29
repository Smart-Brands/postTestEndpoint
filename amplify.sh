source ~/.bashrc 2> /dev/null || true
echo "## Processing Environment Variables"
echo "# Set Environment Variable: AWS_ACCESS_KEY_ID"
export AWS_ACCESS_KEY_ID="AKIAUAMQQUGZE2O2JGSH"
echo "# Set Environment Variable: AWS_SECRET_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="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"
AMPLIFY_BACKEND_START_DATE=$(date +%s)
echo "## Starting Backend Build"
echo "# Starting phase: preBuild"
echo $'# Executing command: npm install'
npm install
EXIT=$?; if [ $EXIT -gt 0 ]; then exit $EXIT; fi
echo "# Completed phase: preBuild"
echo "# Starting phase: build"
echo $'# Executing command: npm run deploy'
npm run deploy
EXIT=$?; if [ $EXIT -gt 0 ]; then exit $EXIT; fi
STACKINFO="$(amplify env get --json --name main)"
echo "# Completed phase: build"
echo "## Completed Backend Build"
AMPLIFY_BACKEND_DURATION=$(( $(date +%s) - $AMPLIFY_BACKEND_START_DATE ))
echo "{\"backendDuration\": $AMPLIFY_BACKEND_DURATION}"
if command -v node &> /dev/null; then node -v > /tmp/.amplify_nodejs_version.txt; fi;