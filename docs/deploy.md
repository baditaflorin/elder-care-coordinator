# Deployment

GitHub Pages serves this repository from the `main` branch `/docs` folder.

Live URL: https://baditaflorin.github.io/elder-care-coordinator/

To republish manually:

```bash
make build
git add docs
git commit -m "ops: publish pages build"
git push
```

Rollback is a normal git revert of the publishing commit, followed by `git push`.

No custom domain is configured in v1. If one is added later, place `CNAME` in `docs/` and configure DNS with GitHub Pages.
