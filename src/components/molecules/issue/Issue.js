'use strict';

import React from 'react';
import CounterBox from 'components/molecules/counter_box/CounterBox';
import Arrows from 'components/molecules/arrows/Arrows';
import marked from 'marked';
import classNames from 'classnames';
require('./stylesheets/issue.scss');

class Issue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {active:  false};
  }
  rawMarkup(sanitizedHTMLAfterMarked) {
    return {__html: sanitizedHTMLAfterMarked};
  }
  parseMarkdown(text) {
    // Default values
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: true,
      smartLists: true,
      smartypants: false
    });
    return marked(text);
  }
  getRepoName(repoUrl) {
    let splittedUrl = repoUrl.split('/');

    return `${splittedUrl[splittedUrl.length - 1]}: `;
  }
  toggleIssue() {
    console.log('toggling');
    this.setState({active: !this.state.active});
  }
  render() {
    var issue = this.props.issue;
    var issueClasses = classNames({
     'issue-component': true,
     'row': true,
     'active': this.state.active
   });
    return (
      <div className={issueClasses}>
        <div className='description column'>
          <header>
            <h4 onClick={this.toggleIssue.bind(this)}><b>{this.getRepoName(issue.repository_url)}</b>{issue.title}</h4>
          </header>
          <div className='summary'
            dangerouslySetInnerHTML={this.rawMarkup(marked(issue.body || ''))}>
          </div>
        </div>
      </div>
    );
  }
}

Issue.displayName = 'MoleculeIssue';

// Uncomment properties you need
// Issue.propTypes = {};
// Issue.defaultProps = {};

// TODO add this when open issues, to make the interaction only when the user wants to, instead of throwing at their face
// <CounterBox numVotes={issue.numVotes}
//             numComments={issue.numComments}
//             difficulty={issue.difficulty} />
// <Arrows />

export default Issue;
