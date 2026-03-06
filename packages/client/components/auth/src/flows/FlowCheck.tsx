import { Trans } from "@lingui-solid/solid/macro";

import { Button, Row } from "@revolt/ui";

import { FlowTitle } from "./Flow";

/**
 * Keep track of email within the same session
 */
let email = "postmaster@revolt.wtf";

/**
 * Persist email information temporarily
 */
export function setFlowCheckEmail(e: string) {
  email = e;
}

/**
 * Flow to tell the user to check their email
 */
export default function FlowCheck() {
  return (
    <>
      <FlowTitle
        subtitle={<Trans>Your account has been created.</Trans>}
        emoji="wave"
      >
        <Trans>Head to the login page.</Trans>
      </FlowTitle>
      <Row align justify>
        <a href="/login/auth">
          <Button variant="text">
            <Trans>Login</Trans>
          </Button>
        </a>
      </Row>
    </>
  );
}
