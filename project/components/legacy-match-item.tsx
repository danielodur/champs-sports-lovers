<TouchableOpacity
  style={[
    styles.container,
    {
      backgroundColor: theme.colors.backgroundSecondary,
      borderColor: theme.colors.border,
    },
  ]}
  onPress={() => onPress(fixture)}
  activeOpacity={0.85}
  delayPressIn={0}
  delayPressOut={0}
  delayLongPress={500}
  pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
>
  {/* Header - Fixed positioning for uniform time placement */}
  <View style={styles.header}>
    <View style={styles.leftHeaderSection}>
      {/* League name with FIXED width to ensure uniform time positioning */}
      {/* <View style={styles.leagueContainer}>
            <Text
              style={[styles.league, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {displayLeagueName}
            </Text>
          </View> */}

      {/* Time at EXACT fixed position */}
      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
          {formatTime(match.startTime)}
        </Text>
      </View>
    </View>

    {/* Large followers count at right corner */}
    {match.viewers && parseInt(match.viewers) > 0 && (
      <View style={styles.headerFollowersContainer}>
        <Users size={12} color="#666666" strokeWidth={1.5} />
        <Text style={[styles.headerFollowersCount, { color: "#666666" }]}>
          {formatFollowers(match.viewers)}
        </Text>
      </View>
    )}
  </View>

  {/* Main Match Content - Redesigned to prevent text breaking */}
  <View style={styles.matchContentNew}>
    {/* Left Side - Home Team Section */}
    <View style={styles.leftSectionNew}>
      {/* Favorite Star - Optimized for smooth interaction */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();

          // ✅ ENHANCED VALIDATION: Ensure match ID exists and is valid
          if (
            !match.id ||
            typeof match.id !== "string" ||
            match.id.trim() === ""
          ) {
            console.error("❌ MATCHITEM: INVALID MATCH ID:", match.id);
            console.error("❌ MATCHITEM: Match object:", match);
            return;
          }

          // ✅ SAFETY CHECK: Ensure match has required properties
          if (!match.home?.name || !match.away?.name) {
            console.error(
              "❌ MATCHITEM: INVALID MATCH DATA - missing team names"
            );
            console.error("❌ MATCHITEM: Match object:", match);
            return;
          }

          console.log(
            `🌟 STAR PRESSED: ${match.home.name} vs ${match.away.name}`
          );
          console.log(`   Match ID: ${match.id}`);
          console.log(`   Current state: isFavorite=${match.isFavorite}`);
          console.log(
            `   Action: ${match.isFavorite ? "UNFAVORITE" : "FAVORITE"}`
          );

          // ✅ FORCE CALL: Always attempt to toggle, regardless of state
          onToggleFavorite(match.id);
        }}
        style={[
          styles.favoriteButtonNew,
          {
            backgroundColor: "transparent", // Clean look
            borderRadius: 12,
            padding: 8, // Generous touch area
            borderWidth: 0,
            borderColor: "transparent",
          },
        ]}
        activeOpacity={0.5} // Strong visual feedback
        delayPressIn={0}
        delayPressOut={0}
        hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }} // Large touch area
      >
        <Star
          size={18} // Reduced size to save space for longer team names
          color={match.isFavorite ? "#FF4444" : theme.colors.textSecondary}
          fill={match.isFavorite ? "#FF4444" : "none"} // Red fill only inside star
          strokeWidth={match.isFavorite ? 2.5 : 1.5} // Slightly reduced bold width
        />
      </TouchableOpacity>

      {/* Home Team Name - optimized layout to prevent jumping */}
      <View
        style={[
          styles.homeTeamSectionNew,
          // ✅ SIMPLE FLASH EFFECT: Use simple opacity instead of complex animation
          homeTeamFlash && {
            backgroundColor: "#FF444450",
            borderRadius: 6,
          },
        ]}
      >
        <View
          style={[
            styles.homeTeamNameWithRankingContainer,
            { justifyContent: "flex-end" },
          ]}
        >
          {/* ✅ HOME TEAM: Ranking INLINE with first line of team name - RIGHT ALIGNED */}
          <Text
            style={[
              styles.teamNameNew,
              { color: theme.colors.text, textAlign: "right" },
            ]}
            allowFontScaling={false}
            adjustsFontSizeToFit={false}
          >
            {match.home.rank && (
              <Text style={[styles.homeTeamRanking, { color: "#888888" }]}>
                [{match.home.rank}]
              </Text>
            )}
            {cleanScheduledText(formatTeamName(match.home.name || "Home Team"))}
          </Text>
        </View>
        {/* Home corners - Enhanced visibility and positioning */}
        {(match.status === "live" || match.status === "finished") && (
          <View
            style={[
              styles.cornersContainerNew,
              {
                alignSelf: "flex-end",
                position: "absolute",
                bottom: -2,
                right: 2,
              },
            ]}
          >
            <Flag size={10} color="#888888" />
            <Text
              style={[styles.cornersNew, { color: theme.colors.textSecondary }]}
            >
              {match.home.corners || 0}
            </Text>
          </View>
        )}
      </View>
    </View>

    {/* Center - Score and Status - Redesigned vertical layout */}
    <View style={styles.centerSectionNew}>
      {match.status === "upcoming" ? (
        <>
          <Text style={[styles.vsText, { color: theme.colors.text }]}>VS</Text>
          {getUpcomingMatchText() && (
            <Text
              style={[styles.nextText, { color: theme.colors.primary }]}
              allowFontScaling={false}
              adjustsFontSizeToFit={false}
              numberOfLines={1}
            >
              {getUpcomingMatchText()}
            </Text>
          )}
        </>
      ) : (
        <View style={styles.scoreStackNew}>
          {/* Timer on top */}
          <Text
            style={[
              styles.statusTextNew,
              { color: getStatusColor(match.status) },
            ]}
          >
            {(() => {
              const statusText = getStatusText();
              // ✅ APOSTROPHE BLINKING: Make the ' blink every second for live matches
              if (match.status === "live" && statusText.includes("'")) {
                const parts = statusText.split("'");
                return (
                  <>
                    {parts[0]}
                    <Text style={{ opacity: isBlinking ? 0.3 : 1.0 }}>'</Text>
                    {parts[1] || ""}
                  </>
                );
              }
              return statusText;
            })()}
          </Text>

          {/* Main score in center */}
          <Text style={[styles.scoreTextNew, { color: theme.colors.text }]}>
            {cleanScheduledText(match.score || "0-0")}
          </Text>

          {/* Half-time score below - Enhanced logic for second half display */}
          {(() => {
            const getMinuteFromStatus = (statusText: string): number => {
              if (!statusText) return 0;
              const matchResult = statusText.match(/\d+/);
              return matchResult ? parseInt(matchResult[0]) : 0;
            };

            const currentMinute = getMinuteFromStatus(match.statusText || "");
            const apiStatus = match.statusText?.toUpperCase() || "";

            // ✅ ENHANCED: Show HT score for second half matches and finished matches
            const shouldShowHT =
              match.status === "finished" || // Always show for finished matches
              (match.status === "live" &&
                (apiStatus === "2H" || // Second half (most important)
                  currentMinute >= 46 || // Second half based on minute
                  apiStatus === "HT" || // Half-time break
                  currentMinute >= 45)); // End of first half

            // ✅ DEBUG: Enhanced logging for HT score visibility
            if (
              match.halfTimeScore &&
              match.halfTimeScore !== "--" &&
              match.halfTimeScore !== "0-0"
            ) {
              console.log(
                `🏁 HT SCORE CHECK: ${match.home.name} vs ${match.away.name}`
              );
              console.log(
                `  Status: ${match.status}, StatusText: ${match.statusText}, API Status: ${apiStatus}`
              );
              console.log(
                `  Current Minute: ${currentMinute}, HT Score: ${match.halfTimeScore}`
              );
              console.log(`  Should Show HT: ${shouldShowHT}`);
            }

            return (
              shouldShowHT &&
              match.halfTimeScore &&
              match.halfTimeScore !== "--" &&
              match.halfTimeScore !== "0-0"
            );
          })() && (
            <Text
              style={[
                styles.halfTimeTextNew,
                { color: theme.colors.textSecondary },
              ]}
            >
              HT: {match.halfTimeScore}
            </Text>
          )}
        </View>
      )}
    </View>

    {/* Right Side - Away Team Section */}
    <View style={styles.rightSectionNew}>
      {/* Away Team Name - optimized layout to prevent jumping */}
      <View
        style={[
          styles.awayTeamSectionNew,
          // ✅ SIMPLE FLASH EFFECT: Use simple opacity instead of complex animation
          awayTeamFlash && {
            backgroundColor: "#FF444450",
            borderRadius: 6,
          },
        ]}
      >
        <View style={styles.awayTeamNameWithRankingContainer}>
          {/* ✅ AWAY TEAM: Ranking INLINE after team name */}
          <Text
            style={[
              styles.teamNameNew,
              { color: theme.colors.text, textAlign: "left" },
            ]}
            allowFontScaling={false}
            adjustsFontSizeToFit={false}
          >
            {cleanScheduledText(formatTeamName(match.away.name || "Away Team"))}
            {match.away.rank && (
              <Text style={[styles.awayTeamRanking, { color: "#888888" }]}>
                [{match.away.rank}]
              </Text>
            )}
          </Text>
        </View>
        {/* Away corners - Enhanced visibility and positioning */}
        {(match.status === "live" || match.status === "finished") && (
          <View
            style={[
              styles.cornersContainerNew,
              {
                alignSelf: "flex-start",
                position: "absolute",
                bottom: -2,
                left: 0,
              },
            ]}
          >
            <Flag size={10} color="#888888" />
            <Text
              style={[styles.cornersNew, { color: theme.colors.textSecondary }]}
            >
              {match.away.corners || 0}
            </Text>
          </View>
        )}
      </View>

      {/* Broadcast Button - Optimized to prevent navigation conflicts */}
      <TouchableOpacity
        style={[
          styles.broadcastButtonNew,
          { backgroundColor: getBroadcastButtonProps().backgroundColor },
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onPress(match);
        }}
        activeOpacity={0.8}
        delayPressIn={0}
        delayPressOut={0}
        hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
      >
        {React.createElement(getBroadcastButtonProps().icon, {
          size: 14,
          color: getBroadcastButtonProps().iconColor,
        })}
      </TouchableOpacity>
    </View>
  </View>

  {/* ✅ EXTRA TIME BANNER: Positioned below main match content like Chinese app */}
  {extraTimeInfo && (
    <View
      style={[
        styles.extraTimeBanner,
        { backgroundColor: "rgba(139, 69, 19, 0.25)" },
      ]}
    >
      <Text style={styles.extraTimeText}>
        {extraTimeInfo.display} {extraTimeInfo.currentScore}
      </Text>
    </View>
  )}
</TouchableOpacity>;


/*
   <TouchableOpacity
        style={[
          styles.matchContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onPress(fixture)}
        activeOpacity={0.85}
        delayPressIn={0}
        delayPressOut={0}
        delayLongPress={500}
        pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
      >
        <View style={styles.leftSection}>
          <Star size={18} color={theme.colors.textSecondary} />
          <View style={styles.teams}>
            <View style={styles.homeTeam}>
              {/* TODO: Add team rank and name */}
              <Text style={{ fontSize: 10, color: theme.colors.text }}>
                [{fixture.teams.home.id?.toString()[1]}]
              </Text>
              <Image
                source={{ uri: fixture.teams?.home?.logo || "" }}
                style={styles.teamLogo}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "semibold",
                  color: theme.colors.text,
                }}
              >
                {fixture.teams?.home?.name}
              </Text>
            </View>
            <View style={styles.awayTeam}>
              {/* TODO: Add team rank and name */}
              <Text style={{ fontSize: 10, color: theme.colors.text }}>
                [{fixture.teams.away.id?.toString()[1]}]
              </Text>
              <Image
                source={{ uri: fixture.teams?.away?.logo || "" }}
                style={styles.teamLogo}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "semibold",
                  color: theme.colors.text,
                }}
              >
                {fixture.teams?.away?.name}
              </Text>
            </View>
          </View>
          <View style={styles.matchEvents}>
            <View style={styles.homeMatchEvent}>
              <View>
                <Flag size={10} color="#888888" />
                <Text style={{ fontSize: 10, color: theme.colors.text }}>
                  {
                    fixture.events?.filter(
                      (event) =>
                        event.detail === "Corner" &&
                        event.team.id === fixture.teams?.home?.id
                    ).length
                  }
                </Text>
              </View>
              {getCardCount(fixture.teams?.home?.id, "yellow") && (
                <Text style={styles.yellowCard}>
                  {getCardCount(fixture.teams?.home?.id, "yellow")}
                </Text>
              )}
              {getCardCount(fixture.teams?.home?.id, "red") && (
                <Text style={styles.redCard}>
                  {getCardCount(fixture.teams?.home?.id, "red")}
                </Text>
              )}
            </View>
            <View style={styles.awayMatchEvent}>
              <View>
                <Flag size={10} color="#888888" />
                <Text style={{ fontSize: 10, color: theme.colors.text }}>
                  {
                    fixture.events?.filter(
                      (event) =>
                        event.detail === "Corner" &&
                        event.team.id === fixture.teams?.away?.id
                    ).length
                  }
                </Text>
              </View>
              {getCardCount(fixture.teams?.away?.id, "yellow") && (
                <Text style={styles.yellowCard}>
                  {getCardCount(fixture.teams?.away?.id, "yellow")}
                </Text>
              )}
              {getCardCount(fixture.teams?.away?.id, "red") && (
                <Text style={styles.redCard}>
                  {getCardCount(fixture.teams?.away?.id, "red")}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.rightSection}>
          {(fixture.fixture.status.short === "NS" ||
            fixture.fixture.status.short === "FT") && (
            <Text style={[styles.time, { color: theme.colors.text }]}>
              {formatTime(fixture.fixture.date)}
            </Text>
          )}
          {/* {fixture.score.halftime.home && fixture.score.halftime.away && ( */}
          {fixture.fixture.status.short !== "1H" &&
            fixture.fixture.status.short !== "NS" && (
              <Text style={{ color: theme.colors.text, fontSize: 10 }}>
                {`HT: [${fixture.score.halftime.home} - ${fixture.score.halftime.away}]`}
              </Text>
            )}
          {/* )} */}
          {fixture.fixture.status.short !== "NS" &&
            fixture.fixture.status.short !== "FT" && (
              <Text style={[styles.time, { color: "red" }]}>
                {`${fixture.fixture.status.elapsed}${
                  fixture.fixture.status.extra
                    ? "+" + fixture.fixture.status.extra
                    : ""
                }`}
              </Text>
            )}
          {fixture.fixture.status.short !== "NS" && (
            <View style={styles.scores}>
              <Text
                style={[
                  styles.homeScore,
                  {
                    color:
                      fixture.fixture.status.short === "FT"
                        ? theme.colors.text
                        : "red",
                  },
                ]}
              >
                {fixture.goals.home}
              </Text>
              <Text
                style={[
                  styles.awayScore,
                  {
                    color:
                      fixture.fixture.status.short === "FT"
                        ? theme.colors.text
                        : "red",
                  },
                ]}
              >
                {fixture.goals.away}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.broadcastButtonNew,
              { backgroundColor: getBroadcastButtonProps().backgroundColor },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onPress(fixture);
            }}
            activeOpacity={0.8}
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          >
            {React.createElement(getBroadcastButtonProps().icon, {
              size: 14,
              color: getBroadcastButtonProps().iconColor,
            })}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
*/