# Release process

1. Bump the version in `package.json` following SemVer.
2. Move the Unreleased CHANGELOG entries under a new dated heading.
3. Commit as `chore(release): vX.Y.Z`.
4. Tag the commit: `git tag vX.Y.Z`.
5. Push with tags: `git push --follow-tags`.
6. Open the GitHub release from the tag and paste the CHANGELOG section.
7. Announce in the #releases channel.
