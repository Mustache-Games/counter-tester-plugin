mkdir -p dist
cp manifest.json plugin.js dist/
cd dist
zip -r ../counter-tester.zip .
cd ..
echo 'Build complete: counter-tester.zip created!'