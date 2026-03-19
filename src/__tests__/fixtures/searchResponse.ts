export const searchResponseFixture = {
    total: 50,
    objectIDs: Array.from({length: 50}, (_, i) => i + 1),
};

export const emptySearchResponse = {
    total: 0,
    objectIDs: null,
};
