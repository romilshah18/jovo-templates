import {AlexaHandler} from './alexa/handler';
import {GoogleHandler} from './google/handler';
import {Player} from './player';
import {App} from 'jovo-framework';
import {Alexa} from 'jovo-platform-alexa';
import {JovoDebugger} from 'jovo-plugin-debugger';
import {FileDb} from 'jovo-db-filedb';
import {GoogleAssistant} from 'jovo-platform-googleassistant';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb(),
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    NEW_USER() {
        this.$speech.addText('Welcome to the Podcast Player!')
            .addText('Would you like to begin listening from episode one or rather choose from a list?');

        return this.ask(this.$speech);
    },

    LAUNCH() {
        this.$speech.addText('Would you like to resume where you left off or listen to the latest episode?');

        this.ask(this.$speech);
    },

    FirstEpisodeIntent() {
        let episode = Player.getFirstEpisode();
        let currentIndex = Player.getEpisodeIndex(episode);
        this.$user.$data.currentIndex = currentIndex;
        this.$speech.addText('Here is the first episode.');

        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            this.$alexaSkill.$audioPlayer
                .setOffsetInMilliseconds(0)
                .play(episode.url, `${currentIndex}`)
                .tell(this.$speech);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(episode.url, episode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask(this.$speech);
        }
    },

    LatestEpisodeIntent() {
        let episode = Player.getLatestEpisode();
        let currentIndex = Player.getEpisodeIndex(episode);
        this.$user.$data.currentIndex = currentIndex;
        this.$speech.addText('Here is the latest episode.');

        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            this.$alexaSkill.$audioPlayer
                .setOffsetInMilliseconds(0)
                .play(episode.url, `${currentIndex}`)
                .tell(this.$speech);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(episode.url, episode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask(this.$speech);
        }
    },

    ListIntent() {
        const indices = Player.getRandomIndices(4);
        this.$session.$data.episodeIndices = indices;

        this.$speech.addText('Here\'s a list of episodes: ');
        for (let i = 0; i < indices.length; i++) {
            let episode = Player.getEpisode(indices[i]);
            this.$speech.addSayAsOrdinal(i + 1)
                .addText(episode.title)
                .addBreak('100ms');
        }
        this.$speech.addText('Which one would you like to listen to?');
        this.ask(this.$speech);
    },

    ChooseFromListIntent() {
        const ordinal = this.$inputs.ordinal;
        let episodeIndices = this.$session.$data.episodeIndices;
        let episodeIndex = episodeIndices[parseInt(ordinal.key!) - 1];
        this.$user.$data.currentIndex = episodeIndex;
        let episode = Player.getEpisode(episodeIndex);
        this.$speech.addText('Enjoy');

        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            this.$alexaSkill.$audioPlayer
                .setOffsetInMilliseconds(0)
                .play(episode.url, `${episodeIndex}`)
                .tell(this.$speech);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(episode.url, episode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask(this.$speech);
        }
    },

    ResumeIntent() {
        let currentIndex = this.$user.$data.currentIndex;
        let episode = Player.getEpisode(currentIndex);
        this.$speech.addText('Resuming your episode.');

        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            let offset = this.$user.$data.offset;
            this.$alexaSkill.$audioPlayer
                .setOffsetInMilliseconds(offset)
                .play(episode.url, `${currentIndex}`)
                .tell(this.$speech);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(episode.url, episode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask(this.$speech);
        }
    },

    NextIntent() {
        let currentIndex = this.$user.$data.currentIndex;
        let nextEpisode = Player.getNextEpisode(currentIndex);
        if (!nextEpisode) {
            return this.tell('That was the most recent episode. You have to wait until a new episode gets released.');
        }
        currentIndex = Player.getEpisodeIndex(nextEpisode);
        this.$user.$data.currentIndex = currentIndex;
        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            this.$alexaSkill.$audioPlayer.setOffsetInMilliseconds(0).play(nextEpisode.url, `${currentIndex}`);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(nextEpisode.url, nextEpisode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask('Enjoy');
        }
        return;
    },

    PreviousIntent() {
        let currentIndex = this.$user.$data.currentIndex;
        let previousEpisode = Player.getPreviousEpisode(currentIndex);
        if (!previousEpisode) {
            return this.tell('You are already at the oldest episode.');
        }
        currentIndex = Player.getEpisodeIndex(previousEpisode);
        this.$user.$data.currentIndex = currentIndex;
        if (this.$alexaSkill && this.$alexaSkill.$audioPlayer) {
            this.$alexaSkill.$audioPlayer.setOffsetInMilliseconds(0).play(previousEpisode.url, `${currentIndex}`);
        } else if (this.$googleAction && this.$googleAction.$mediaResponse) {
            this.$googleAction.$mediaResponse.play(previousEpisode.url, previousEpisode.title);
            this.$googleAction.showSuggestionChips(['pause', 'start over']);
            this.ask('Enjoy');
        }
        return;
    },

    HelpIntent() {
        this.$speech.addText('You can either listen to episode one or the latest episode or choose from a random list of episodes.')
            .addText('Which one would you like to do?');

        this.ask(this.$speech);
    },
});

app.setAlexaHandler(AlexaHandler);
app.setGoogleAssistantHandler(GoogleHandler);

export {app};