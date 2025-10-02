# TRR Library

Welcome to the TRR Library! This is the frontend for the Technique Research
Report repository. This repo holds the code that runs the frontend only.  Unless
you know this is where you want to be, you're probably looking for the [TRR
repo] itself. If you're looking for the frontend GUI, go [here].

[TRR Repo]: https://github.edwardjones.com/ejsecure/technique-research-reports
[here]: https://github.edwardjones.com/pages/ejsecure/trr-library/

## Configuring the TRR Library Frontend

This frontend has been designed to support internally-hosted TRR repos. Simply copy the repo to an internal GitHub instance, and configure the backends.json file in the base of the repo to point at the public TRR Library and any other internal or external backends desired. For each backend to be included:

```text
"Name" is the name of source as you want to show in the results
"BaseUrl" is the URL to the main branch in the GitHub repo
"RawIndexBaseUrl" is the URL (if remote) or path (if internal) of folder holding the platforms.json and index.json for the backend.
```

If the repository is public, set the `RawIndexBaseUrl` to the path to the root
folder where the `index.json` is found.  If the repository is private, you can
copy the `platforms.json` and `index.json` into a folder inside the `backends`
folder and set the `RawIndexBaseUrl` to that folder. 

Here is an example configuration using the main public repo and an internal,
private repository hosted in company XYZ's internal GitHub.

```json
[
  {
    "Name":"TRR Library",
    "BaseUrl":"https://github.com/tired-labs/techniques/tree/main/",
    "RawIndexBaseUrl":"https://raw.githubusercontent.com/tired-labs/techniques/main/"
  },
  {
    "Name":"XYZ Internal",
    "BaseUrl":"https://github.internalXYZ.com/org/repo/tree/main/",
    "RawIndexBaseUrl":"backends/internalXYZ/"
  }
]
```
