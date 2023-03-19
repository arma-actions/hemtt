# Setup HEMTT

Supports `ubuntu-*` and `windows-*` runners.

## Usage

Use the latest version of HEMTT:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: arma-actions/hemtt@v1
      name: Setup HEMTT
    - name: Build
      run: hemtt build
```

Specify a version of HEMTT to use:

```yaml
- uses: arma-actions/hemtt@v1
  name: Setup HEMTT
  with:
    version: '1.2.0'
```


