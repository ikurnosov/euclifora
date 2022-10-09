import config from 'config';

export function resolveTicketStatus(state, qaState) {
    const defaultValue = config.app.defaultIssueState;

    if (!state) {
        return defaultValue;
    }

    if (state === 'Verified') {
        state = 'RFT';
    }

    if (qaState === 'Not tested') {
        return config.mappings.status[state];
    }

    return config.mappings.status[qaState];
};
