import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, Terminal, UserPlus, X, ArrowRightCircle, Loader2 } from "lucide-react"; // Added Loader2 for loading icon

function SelectUser({
  searchQuery,
  setSearchQuery,
  searchResults,
  selectedUsers,
  handleAddUser,
  handleAddedUsers,
  handleRemoveUser,
  isLoading // <-- 1. Accept isLoading prop
}) {
  return (
    <>
      <div className="config-search-row">
        <div className="config-search-input-wrapper">
          <Search size={15} className="config-search-icon" />
          <input
            type="text"
            placeholder="Search username (min 3 chars)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="config-search-field"
          />
        </div>
        <button
          type="button"
          className="config-clear-btn"
          onClick={() => setSearchQuery("")}
        >
          Clear
        </button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="config-selected-list">
          <span className="config-selected-label">Selected Users:</span>
          <div className="config-chips-container">
            {selectedUsers.map((user) => (
              <div key={user.id} className="config-user-chip">
                <span>{user.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user)}
                  className="config-chip-remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="config-results-feed">
        <AnimatePresence mode="wait">
          {searchQuery.trim().length < 3 ? (
            <motion.div
              key="min-chars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="config-empty-state"
            >
              <Terminal size={24} className="config-empty-icon" />
              <p>Type at least 3 characters to search users...</p>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="config-empty-state"
            >
              <Loader2 size={24} className="config-empty-icon config-spinner" />
              <p>Searching users...</p>
            </motion.div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isAlreadySelected = selectedUsers.some(
                (u) => u.id === user.id || u.username === user.username
              );
              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="config-item-card"
                >
                  <div className="config-item-info">
                    <div className="config-user-profile">
                      <div className="config-user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="config-item-title">{user.username}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddUser(user)}
                    disabled={isAlreadySelected}
                    className={`config-action-btn ${isAlreadySelected ? "copied" : ""}`}
                    title={isAlreadySelected ? "Already added" : "Add user"}
                  >
                    {isAlreadySelected ? (
                      <Check size={14} />
                    ) : (
                      <UserPlus size={14} />
                    )}
                    <span>{isAlreadySelected ? "Added" : "Add"}</span>
                  </button>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="config-empty-state"
            >
              <Terminal size={24} className="config-empty-icon" />
              <p>No users found.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="config-footer-action">
        <button
          type="button"
          className="config-share-submit-btn"
          onClick={handleAddedUsers}
          disabled={selectedUsers.length === 0}
        >
          <span>
            {selectedUsers.length !== 0 &&
              `Selected users (${selectedUsers.length})`}
          </span>
          <ArrowRightCircle size={20} />
        </button>
      </div>
    </>
  );
}

export default SelectUser;