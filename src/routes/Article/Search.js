import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Form, Breadcrumb, Card, List, Tag, Icon, Avatar, Button, Pagination } from 'antd';
import DocumentTitle from 'react-document-title';
import { parse } from 'qs';
import { get } from 'lodash';
import Ellipsis from 'components/Ellipsis';
import styles from './Search.less';

const defaultQueryParams = {
  include: 'author,tags',
  pageSize: 5,
};
const loadMorePage = 0;

@Form.create()
@connect(({ article, loading }) => ({ article, loading }))
export default class ArticleSearch extends PureComponent {
  constructor (props) {
    super(props);
    const { location: { search } } = this.props;
    const query = parse(search.substr(1));

    this.state = {
      search: query,
    };
  }

  async componentWillMount () {
    this.handleSearch();
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      const { location: { search } } = nextProps;
      const query = parse(search.substr(1));

      this.setState({ search: query }, this.handleSearch);
    }
  }

  handleSearch = () => {
    const { dispatch } = this.props;
    const { search } = this.state;

    dispatch({
      type: 'article/fetch',
      payload: {
        ...defaultQueryParams,
        ...search,
      },
    });
  };

  fetchMore = page => {
    const { dispatch, article: { pagination } } = this.props;
    const { search } = this.state;

    const current = typeof page === 'number' ? page : pagination.current;

    const effect =
      typeof page === 'number' || (current && current >= loadMorePage)
        ? 'article/fetch'
        : 'article/appendFetch';

    dispatch({
      type: effect,
      payload: {
        ...defaultQueryParams,
        ...search,
        page: current,
        pageSize: pagination.pageSize,
      },
    });
  };

  renderLoadMore = () => {
    const { article: { data, pagination }, loading } = this.props;
    if (data.length === 0) {
      return null;
    }

    if (pagination.current && pagination.current >= loadMorePage) {
      return (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Pagination showQuickJumper {...pagination} onChange={this.fetchMore} />
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button onClick={this.fetchMore} style={{ paddingLeft: 48, paddingRight: 48 }}>
          {loading.effects['article/appendFetch'] ? (
            <span>
              <Icon type="loading" /> 加载中...
            </span>
          ) : (
            '加载更多'
          )}
        </Button>
      </div>
    );
  };

  render () {
    const { article: { data }, loading } = this.props;
    const { search } = this.state;

    const IconText = ({ type, text }) => (
      <span>
        <Icon type={type} style={{ marginRight: 8 }} />
        {text}
      </span>
    );

    const ListContent = ({ data: article }) => (
      <div className={styles.listContent}>
        <div className={styles.description}>
          <Ellipsis lines={3}>
            {article.highlight.content
              ? article.highlight.content.map((html, key) =>
                (
                  <span
                    key={key}
                    dangerouslySetInnerHTML={{ // eslint-disable-line
                      __html: html,
                    }}
                  />
                ))
              : article.description}
          </Ellipsis>
        </div>
        <div className={styles.extra}>
          <Avatar size="small" icon="user" />
          <Link to={`/article/list?author_id=${get(article, 'author.id')}`}>
            {get(article, 'author.name')}
          </Link>
          &nbsp;&nbsp;发布在&nbsp;&nbsp;
          <Link to={`/article/${article.id}/details`}>
            {window.location.hostname}
            {window.location.port === 80 ? '' : `:${window.location.port}`}
            {`/article/${article.id}/details`}
          </Link>
          <em>{article.updated_at}</em>
        </div>
      </div>
    );

    return (
      <DocumentTitle title="文章列表 - 我的网络日志">
        <Fragment>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>
              <Link to="/">首页</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>文章列表</Breadcrumb.Item>
          </Breadcrumb>
          <Card title={`关于 “${search.keyword}” 的搜索结果`} bordered={false}>
            <List
              size="large"
              loading={loading.effects['article/fetch']}
              rowKey={record => record.id}
              itemLayout="vertical"
              dataSource={data}
              loadMore={this.renderLoadMore()}
              renderItem={article => (
                <List.Item
                  key={article.id}
                  actions={[
                    <IconText type="star-o" text={999} />,
                    <IconText type="like-o" text={999} />,
                    <IconText type="message" text={999} />,
                  ]}
                  extra={
                    <div className={styles.listItemExtra}>
                      {article.preview && <img src={article.preview} alt="预览" />}
                    </div>
                  }
                >
                  <List.Item.Meta
                    title={
                      <Link
                        className={styles.listItemMetaTitle}
                        to={`/article/${article.id}/details`}
                      >
                        {article.highlight.title
                          ? article.highlight.title.map((html, key) =>
                            (
                              <span
                                key={key}
                                dangerouslySetInnerHTML={{ // eslint-disable-line
                                  __html: html,
                                }}
                              />
                            ))
                          : article.title}
                      </Link>
                    }
                    description={
                      <span>
                        {article.tags.map(tag => (
                          <Link key={tag.id} to={`/article/list?tags[0]=${tag.id}`}>
                            <Tag>{tag.name}</Tag>
                          </Link>
                        ))}
                      </span>
                    }
                  />
                  <ListContent data={article} />
                </List.Item>
              )}
            />
          </Card>
        </Fragment>
      </DocumentTitle>
    );
  }
}
