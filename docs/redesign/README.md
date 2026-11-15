# Redesign review screenshots

Captured from this branch's production build with a synthetic Trading 212 export
(no real data). `before/` is `main` at the time the branch was cut.

This folder exists only to make the pull request reviewable. It lives in its own
commit, so it can be dropped before merging.

| Screen | Before | After |
|---|---|---|
| Landing, first view | ![](before/landing-hero-desktop.jpg) | ![](after/landing-hero-desktop.jpg) |
| Landing, full page | ![](before/landing-full-desktop.jpg) | ![](after/landing-full-desktop.jpg) |
| Dashboard, upload | ![](before/dash-upload-desktop.jpg) | ![](after/dash-upload-desktop.jpg) |
| Dashboard, portfolio | ![](before/dash-overview-desktop.jpg) | ![](after/dash-overview-desktop.jpg) |
| Dashboard, dividends | ![](before/dash-dividends-desktop.jpg) | ![](after/dash-dividends-desktop.jpg) |
| Dashboard, trading activity | ![](before/dash-activity-desktop.jpg) | ![](after/dash-activity-desktop.jpg) |
| Dashboard, stock detail | ![](before/dash-stock-desktop.jpg) | ![](after/dash-stock-desktop.jpg) |
| Articles | ![](before/articles-desktop.jpg) | ![](after/articles-desktop.jpg) |
| Landing, mobile | ![](before/landing-full-mobile.jpg) | ![](after/landing-full-mobile.jpg) |
| Portfolio, mobile | ![](before/dash-overview-mobile.jpg) | ![](after/dash-overview-mobile.jpg) |

More "after" screens (article page, 404, and every dashboard view on mobile) are in `after/`.

In the "before" dividends and stock screenshots the charts are empty because the
old capture ran before their entrance animation; the figures showing `€NaN` are
real and are fixed on this branch.
