# Test Cases

## General

* Open main page
* Open prompt page with existing ID
* Open prompt page with non-existing ID
* Open prompt page with malicious ID (e.g. SQL/path injection)

## Sharing

* Share unsaved prompt
* Clone saved prompt
    * Follow read-only link
    * Follow editable link
* Update saved prompt with correct editKey
* Update saved prompt with incorrect editKey

## Predict

* Open existing prompt with prediction
* Change template in existing prompt with prediction -> warning should appear
* Predict unsaved prompt
* Predict saved prompt with existing prediction
* Predict saved prompt without existing prediction
* Predict with correct OpenAI key
* Predict with wrong OpenAI key
* Predict empty prompt -> error

## Share + Predict

* Share prompt with prediction
* Update prompt with different template AND new prediction
* Update prompt with different template AND old prediction -> warning should appear in shared page (both edit and readonly)

## Backwards Compatibility

* Open V1 prompts
* Open V2 prompts
